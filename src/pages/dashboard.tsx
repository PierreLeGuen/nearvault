import { useEffect, useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import HeaderTitle from "~/components/ui/header";
import { useGetBalanceBetweenDates } from "~/hooks/dashboard";
import { NextPageWithLayout } from "./_app";

const Dashboard: NextPageWithLayout = () => {
  return (
    <ContentCentered>
      <HeaderTitle level="h1" text="Dashboard" />
      <PlotBalances />
    </ContentCentered>
  );
};

const PlotBalances = () => {
  const dates = useMemo(() => {
    console.log("Dashboard");

    const old = new Date();
    const today = new Date();
    old.setDate(old.getDate() - 5);
    return [old, today];
  }, []);

  const query = useGetBalanceBetweenDates(
    dates[0],
    dates[1],
    "pierre-dev.near",
  );

  useEffect(() => {
    console.log(query.map((q) => q.data));
  }, [query]);

  return (
    <>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={query.map((q) => q.data)}>
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
            tickFormatter={(value) => `$${value.balance}`}
          />
          <Bar
            dataKey="total"
            fill="currentColor"
            radius={[4, 4, 0, 0]}
            className="fill-primary"
          />
        </BarChart>
      </ResponsiveContainer>
      <div>
        {query.map((q, idx) => (
          <div key={idx}>{JSON.stringify(q.data)}</div>
        ))}
      </div>
    </>
  );
};

Dashboard.getLayout = getSidebarLayout;

export default Dashboard;
