interface HeaderTitleProps {
  text: string;
  level?: "h1" | "h2" | "h3";
}

const HeaderTitle = ({ text, level = "h1" }: HeaderTitleProps) => {
  const HeaderTag = level as keyof JSX.IntrinsicElements;

  let classNames = "text-gray-800";
  switch (level) {
    case "h1":
      classNames += " text-3xl font-bold";
      break;
    case "h2":
      classNames += " text-xl";
      break;
    case "h3":
      classNames += " text-lg";
      break;
    default:
      classNames += " text-2xl";
  }

  return <HeaderTag className={classNames}>{text}</HeaderTag>;
};

export default HeaderTitle;
