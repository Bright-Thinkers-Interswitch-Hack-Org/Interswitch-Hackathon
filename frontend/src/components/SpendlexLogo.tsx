import logo from "@/assets/spendlex-logo.jpeg";

const SpendlexLogo = ({ size = 40 }: { size?: number }) => (
  <div className="flex items-center gap-2">
    <img src={logo} alt="Spendlex" width={size} height={size} className="object-contain" />
    <span className="text-xl font-bold text-foreground">Spendlex</span>
  </div>
);

export default SpendlexLogo;