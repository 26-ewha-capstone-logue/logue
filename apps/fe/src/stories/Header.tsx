import { Button } from './Button';

type User = {
  name: string;
};

export interface HeaderProps {
  user?: User;
  onLogin: () => void;
  onLogout: () => void;
  onCreateAccount: () => void;
}

export const Header = ({
  user,
  onLogin,
  onLogout,
  onCreateAccount,
}: HeaderProps) => (
  <header className="flex flex-wrap items-center justify-between gap-16 border-b border-gray-200 px-16 py-12">
    <div />
    <div className="flex items-center gap-8">
      {user ? (
        <>
          <span className="text-sm">
            Welcome, <b>{user.name}</b>!
          </span>
          <Button size="small" onClick={onLogout} label="Log out" />
        </>
      ) : (
        <>
          <Button size="small" onClick={onLogin} label="Log in" />
          <Button
            primary
            size="small"
            onClick={onCreateAccount}
            label="Sign up"
          />
        </>
      )}
    </div>
  </header>
);
