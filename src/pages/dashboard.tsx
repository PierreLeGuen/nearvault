import { useEffect, useMemo, useState } from "react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import HeaderTitle from "~/components/ui/header";
import { useGetBalancesForTeamBetweenDates } from "~/hooks/teams";
import { FungibleTokenMetadata } from "~/lib/ft/contract";
import { NextPageWithLayout } from "./_app";
import { WalletPretty } from "./staking/stake";

const Dashboard: NextPageWithLayout = () => {
  const [old, today] = useMemo(() => {
    const oldDate = new Date();
    const todayDate = new Date();
    oldDate.setDate(oldDate.getDate() - 30);
    return [oldDate, todayDate];
  }, []);

  console.log("RECALLING");

  const query = useGetBalancesForTeamBetweenDates(old, today);

  if (query.isLoading) return <div>Loading...</div>;
  console.log(query.data);

  return (
    <ContentCentered>
      <HeaderTitle level="h1" text="Dashboard" />
      <PlotBalances params={query.data} />
    </ContentCentered>
  );
};

const PlotBalances = ({ params }: { params: Param }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const dates = params
      .map((p) => p.date)
      .filter((v, i, a) => a.indexOf(v) === i);
    const newChartData = getXandY(dates, params);

    setChartData(newChartData);
  }, [params]);

  // Determine all wallet names
  const walletNames = Array.from(
    new Set(params.map((p) => p.wallet.prettyName)),
  );

  // Assign a color to each wallet based on its name
  const walletColors = walletNames.reduce((acc, wallet) => {
    acc[wallet] = stringToColor(wallet);
    return acc;
  }, {});

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        {walletNames.map((wallet) => (
          <Line
            key={wallet}
            type="monotone"
            dataKey={wallet}
            stroke={walletColors[wallet]}
          />
        ))}
        <Line
          type="monotone"
          dataKey="total"
          stroke="#000000" // Black color for the total line
          strokeWidth={2} // Increased width for the total line
          activeDot={{ r: 8 }}
        />
        <Tooltip
          formatter={(value) => `$${value}`}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
};

type Param = {
  date: Date;
  wallet: WalletPretty;
  balance: {
    balance: string;
    ftMetadata: FungibleTokenMetadata;
  };
}[];

const getXandY = (days: Date[], balances: Param) => {
  const chartData = [];

  // Map to store total balance per day
  const totalsPerDay = new Map();

  // Iterate over each date
  days.forEach((day) => {
    const dayData = { date: day.toISOString().split("T")[0], total: 0 };

    // Filter balances for the current day and accumulate
    balances
      .filter((val) => val.date.toISOString().split("T")[0] === dayData.date)
      .forEach(({ wallet, balance }) => {
        const balanceAmount =
          parseFloat(balance.balance) / 10 ** balance.ftMetadata.decimals;
        dayData[wallet.prettyName] = balanceAmount;

        // Accumulate total for the day
        totalsPerDay.set(day, (totalsPerDay.get(day) || 0) + balanceAmount);
      });

    // Add total to dayData
    dayData.total = totalsPerDay.get(day);
    chartData.push(dayData);
  });

  return chartData;
};

const stringToColor = (str) => {
  // Hash a string to a number
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert the hash number to an RGB color
  const color = `rgb(${(hash & 0xff0000) >> 16}, ${(hash & 0x00ff00) >> 8}, ${
    hash & 0x0000ff
  })`;
  return color;
};

Dashboard.getLayout = getSidebarLayout;

export default Dashboard;
