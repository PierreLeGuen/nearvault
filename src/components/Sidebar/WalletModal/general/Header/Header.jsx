import cn from './Header.module.css';

export const Header = ({ children }) => <h2 className={cn.header}>{children}</h2>;
