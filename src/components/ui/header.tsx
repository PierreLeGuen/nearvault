import { cn } from "~/lib/utils";

interface HeaderTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  text?: string;
  level?: "h1" | "h2" | "h3";
}

const HeaderTitle = ({
  level = "h1",
  children,
  text,
  className,
}: HeaderTitleProps) => {
  const HeaderTag = level;

  let classNames = cn(className);
  switch (level) {
    case "h1":
      classNames += " text-3xl font-bold";
      break;
    case "h2":
      classNames += " text-xl";
      break;
    case "h3":
      classNames += " text-lg font-bold";
      break;
    default:
      classNames += " text-2xl";
  }

  return <HeaderTag className={classNames}>{text ?? children}</HeaderTag>;
};

export default HeaderTitle;
