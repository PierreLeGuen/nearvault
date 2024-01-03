import { CodeResult } from "near-api-js/lib/providers/provider";

export const viewFunction = async ({
  contractId,
  method,
  args = {},
  provider,
}) => {
  const result: CodeResult = await provider.query({
    request_type: "call_function",
    finality: "final",
    account_id: contractId,
    method_name: method,
    args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
  });

  return JSON.parse(Buffer.from(result.result).toString());
};
