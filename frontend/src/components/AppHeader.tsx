import { ChevronLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SpendlexLogo from "./SpendlexLogo";

interface AppHeaderProps {
  showBack?: boolean;
  showBell?: boolean;
}

const AppHeader = ({ showBack = true, showBell = true }: AppHeaderProps) => {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-2">
        {showBack && (
          <button onClick={() => navigate(-1)} className="text-foreground" aria-label="Go back">
            <ChevronLeft size={22} />
          </button>
        )}
        <SpendlexLogo size={32} />
      </div>
      {showBell && (
        <button className="text-foreground relative" aria-label="Notifications">
          <Bell size={22} />
        </button>
      )}
    </header>
  );
};

export default AppHeader;
