import { cn } from "~/lib/utils";

type Params = React.HTMLAttributes<HTMLDivElement>;

const ContentCentered = (params: Params) => {
  return (
    <div
      className={cn(
        "flex flex-grow flex-col gap-10 px-6 py-10 lg:px-36",
        params.className,
      )}
    >
      {params.children}
    </div>
  );
};

export default ContentCentered;
