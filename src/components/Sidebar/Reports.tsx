import { PieChartIcon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";

export function ReportsButton() {
  return (
    <Button
      type={"button"}
      variant={"ghost"}
      className="inline-flex justify-start gap-2"
    >
      <PieChartIcon className="h-5 w-5" />
      Reports
    </Button>
  );
}
