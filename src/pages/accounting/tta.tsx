import { useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { type NextPageWithLayout } from "../_app";

const TTA_URL = "https://tta-api.onrender.com";

const Tta: NextPageWithLayout = () => {
  const defaultStartDate = new Date();
  const start = new Date();
  const end = new Date();

  start.setDate(defaultStartDate.getDate() - 30);
  end.setDate(defaultStartDate.getDate() + 1);

  // Create date strings in the format "YYYY-MM-DD"
  const startDateString = start.toISOString().substring(0, 10);
  const endDateString = end.toISOString().substring(0, 10);

  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(startDateString);
  const [endDate, setEndDate] = useState(endDateString);
  const [accountIds, setAccountIds] = useState("");

  const handleDownloadClick = async () => {
    setLoading(true);

    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();

    // Split the accountIds by newline character
    const accountIdsArray = accountIds.split("\n");
    const commaSeparatedAccountIds = accountIdsArray.join(",");

    const url =
      TTA_URL +
      "/tta?start_date=" +
      start +
      "&end_date=" +
      end +
      "&accounts=" +
      commaSeparatedAccountIds;
    console.log(url);

    try {
      const response = await fetch(url, {
        method: "GET",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = "report.csv";
        if (contentDisposition) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, "");
          }
        }
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prose flex flex-col p-3">
      <h1>NEAR transaction report</h1>

      <div className="flex flex-col items-center justify-center gap-3">
        <div className="inline-flex items-center gap-1">
          <input
            type="date"
            name="startDate"
            placeholder="YYYY-MM-DD"
            required
            defaultValue={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />{" "}
          to{" "}
          <input
            type="date"
            name="endDate"
            placeholder="YYYY-MM-DD"
            required
            defaultValue={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />{" "}
          (up until, and excluding)
        </div>
        <textarea
          name="accountIds"
          placeholder="account IDs separated by linebreaks or commas"
          style={{ width: "100%", height: "20rem" }}
          defaultValue={accountIds}
          required
          onChange={(e) => setAccountIds(e.target.value)}
        ></textarea>
        <button
          disabled={loading}
          onClick={handleDownloadClick}
          className="w-1/2 rounded bg-blue-100 px-2 py-1 hover:bg-blue-300"
        >
          {loading
            ? "Loading, time to grab a coffee..."
            : "Download report as CSV"}
        </button>
      </div>
    </div>
  );
};

Tta.getLayout = getSidebarLayout;
export default Tta;
