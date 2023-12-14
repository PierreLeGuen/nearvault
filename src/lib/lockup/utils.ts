/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import BN from "bn.js";
import {
  serialize,
  type BinaryReader,
  type Schema,
} from "near-api-js/lib/utils/serialize";
import { sha256 } from "js-sha256";
import * as nearAPI from "near-api-js";

import {
  type StakingInformation,
  type TransferInformation,
  type FromStateVestingInformation,
} from "./types";
import { type U64 } from "../multisig/contract";

export const saturatingSub = (a: BN, b: BN) => {
  const res = a.sub(b);
  return res.gte(new BN(0)) ? res : new BN(0);
};

export const readNumberOption = (reader: BinaryReader): string => {
  const x = reader.readU8();
  return x === 1 ? reader.readU64().toString() : "0";
};

export const readStringOption = (reader: BinaryReader): string => {
  const x = reader.readU8();
  return x === 1 ? reader.readString() : "";
};

/**
 *
 * @param info {@link FromStateVestingInformation}.
 * @returns string | null.
 */
export const formatVestingInfo = (
  info: FromStateVestingInformation,
): string | null => {
  if (!info?.start) return null; // TODO
  const start = new Date(info.start.divn(1000000).toNumber());
  const cliff = new Date(info.cliff!.divn(1000000).toNumber());
  const end = new Date(info.end!.divn(1000000).toNumber());
  return `from ${start} until ${end} with cliff at ${cliff}`;
};

/**
 *
 * @param releaseDuration BN.
 * @returns BN.
 */
export const formatReleaseDuration = (releaseDuration: BN): BN =>
  releaseDuration.div(new BN("1000000000")).divn(60).divn(60).divn(24);

/**
 *
 * @param lockupDuration
 * @param lockupTimestamp
 * @param hasBrokenTimestamp
 * @returns timestamp.
 */
export const getStartLockupTimestamp = (
  lockupDuration: BN,
  lockupTimestamp: BN,
  hasBrokenTimestamp: boolean,
) => {
  const phase2Time = new BN("1602614338293769340");
  const timestamp = BN.max(phase2Time.add(lockupDuration), lockupTimestamp);
  return hasBrokenTimestamp ? phase2Time : timestamp;
};

/**
 *
 * @param reader {@link BinaryReader}.
 * @returns one of {@link FromStateVestingInformation} or null.
 */
export const getVestingInformation = (
  reader: BinaryReader,
): FromStateVestingInformation | undefined => {
  const vestingType = reader.readU8();
  switch (vestingType) {
    case 1:
      return {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        vestingHash: reader.readArray(() => reader.readU8()),
      };
    case 2:
      return {
        start: reader.readU64(),
        cliff: reader.readU64(),
        end: reader.readU64(),
      };
    case 3:
      return {
        unvestedAmount: reader.readU128(),
        terminationStatus: reader.readU8(),
      };
    default:
      return undefined; // TODO
  }
};

/**
 *
 * @param reader {@link BinaryReader}.
 * @returns one of {@link TransferInformation}.
 */
export const getTransferInformation = (
  reader: BinaryReader,
): TransferInformation => {
  const tiType = reader.readU8();
  if (tiType === 0) {
    return {
      transfers_timestamp: reader.readU64(),
    };
  } else {
    return {
      transfer_poll_account_id: reader.readString(),
    };
  }
};

/**
 *
 * @param reader {@link BinaryReader}.
 * @returns one of {@link TransferInformation}.
 */
export const getStakingInformation = (
  reader: BinaryReader,
): StakingInformation | undefined => {
  const tiType = reader.readU8();
  if (tiType === 0) {
    return undefined;
  } else {
    return {
      staking_pool_account_id: reader.readString(),
      status: reader.readU8(),
      deposit_amount: reader.readU128(),
    };
  }
};

function dateToNs(date: Date): U64 {
  return (new Date(date).getTime() * 1000000).toString();
}

export class VestingSchedule {
  start_timestamp: U64;
  cliff_timestamp: U64;
  end_timestamp: U64;

  constructor(start: U64, cliff: U64, end: U64) {
    this.start_timestamp = start;
    this.cliff_timestamp = cliff;
    this.end_timestamp = end;
  }
}

export class VestingScheduleWithSalt {
  vesting_schedule: VestingSchedule;
  salt: Uint8Array;

  constructor(schedule: VestingSchedule, salt: Uint8Array) {
    this.vesting_schedule = schedule;
    this.salt = salt;
  }
}

interface ComputeVestingScheduleResult {
  vestingSchedule: VestingSchedule;
  salt: Buffer;
  vestingHash: string;
}

function computeVestingSchedule(
  authToken: string,
  public_key: string,
  vesting_start: Date,
  vesting_end: Date,
  vesting_cliff: Date,
): ComputeVestingScheduleResult {
  const vestingSchedule: VestingSchedule = {
    start_timestamp: dateToNs(vesting_start),
    cliff_timestamp: dateToNs(vesting_cliff),
    end_timestamp: dateToNs(vesting_end),
  };

  const salt: Buffer = Buffer.from(
    sha256(Buffer.from(authToken + public_key)).toString(),
    "hex",
  );

  const writer = new nearAPI.utils.serialize.BinaryWriter();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore:next-line
  writer.writeU64(vestingSchedule.start_timestamp);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore:next-line
  writer.writeU64(vestingSchedule.cliff_timestamp);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore:next-line
  writer.writeU64(vestingSchedule.end_timestamp);
  writer.writeU32(salt.length);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore:next-line
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  writer.writeBuffer(salt);

  const bytes = writer.toArray();
  const vestingHash: string = Buffer.from(
    sha256(Buffer.from(bytes)).toString(),
    "hex",
  ).toString("base64");

  hashVestingSchedule({ salt: salt, vesting_schedule: vestingSchedule });

  return {
    vestingSchedule,
    salt,
    vestingHash,
  };
}

export function findProperVestingSchedule(
  lockupOwnerAccountId: string,
  authToken: string,
  start: Date,
  cliff: Date,
  end: Date,
  hashValue: string,
) {
  // According to near-claims, user might have either specified the owner
  // account id (named or implicit) or a public key (a new implicit account
  // id was automatically created)
  const lockupOwnerInputs = [lockupOwnerAccountId];
  if (
    lockupOwnerAccountId.length === 64 &&
    !lockupOwnerAccountId.includes(".")
  ) {
    lockupOwnerInputs.push(
      nearAPI.utils.serialize.base_encode(
        Buffer.from(lockupOwnerAccountId, "hex"),
      ),
    );
  }

  for (
    let lockupOwnerInputId = 0;
    lockupOwnerInputId < lockupOwnerInputs.length;
    ++lockupOwnerInputId
  ) {
    const lockupOwnerInput = lockupOwnerInputs[lockupOwnerInputId] || "";

    for (let timezone = -12; timezone <= 12; timezone += 1) {
      const lockupVestingStartDateCopy = new Date(start);
      lockupVestingStartDateCopy.setHours(start.getHours() + timezone);
      const lockupVestingEndDateCopy = new Date(end);
      lockupVestingEndDateCopy.setHours(end.getHours() + timezone);
      const lockupVestingCliffDateCopy = new Date(cliff);
      lockupVestingCliffDateCopy.setHours(cliff.getHours() + timezone);
      const { vestingSchedule, salt, vestingHash } = computeVestingSchedule(
        authToken,
        lockupOwnerInput,
        lockupVestingStartDateCopy,
        lockupVestingEndDateCopy,
        lockupVestingCliffDateCopy,
      );
      console.log("vestingHash and hashValue", vestingHash, hashValue);
      if (hashValue === vestingHash) {
        console.log("FOUND");

        return {
          vesting_schedule_with_salt: {
            vesting_schedule: vestingSchedule,
            salt: salt.toString("base64"),
          },
        };
      }
    }
  }

  throw new Error(
    `Unable to find proper vesting schedule for ${lockupOwnerAccountId}`,
  );
}

export const VestingScheduleSchema: Schema = new Map([
  [
    VestingSchedule,
    {
      kind: "struct",
      fields: [
        ["start_timestamp", "string"],
        ["cliff_timestamp", "string"],
        ["end_timestamp", "string"],
      ],
    },
  ],
]);

export const VestingScheduleWithSaltSchema: Schema = new Map([
  [
    VestingScheduleWithSalt,
    {
      kind: "struct",
      fields: [
        ["vesting_schedule", VestingSchedule],
        ["salt", [32]], // This represents a byte array of length 32
      ],
    },
  ],
  ...Array.from(VestingScheduleSchema),
  // ... add schemas for other structures
]);

function hashVestingSchedule(vestingScheduleWithSalt: VestingScheduleWithSalt) {
  vestingScheduleWithSalt = new VestingScheduleWithSalt(
    new VestingSchedule(
      vestingScheduleWithSalt.vesting_schedule.start_timestamp,
      vestingScheduleWithSalt.vesting_schedule.cliff_timestamp,
      vestingScheduleWithSalt.vesting_schedule.end_timestamp,
    ),
    vestingScheduleWithSalt.salt,
  );
  const data = serialize(
    VestingScheduleWithSaltSchema,
    vestingScheduleWithSalt,
  );

  const res = sha256.array(data); // Directly feed the Uint8Array to js-sha256
  const base64Hash = Buffer.from(res).toString("base64");
  console.log("hashVestingSchedule", base64Hash);
  return base64Hash;
}
