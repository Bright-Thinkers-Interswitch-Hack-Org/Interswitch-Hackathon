const SpendlexLogo = ({ size = 40 }: { size?: number }) => (
  <div className="flex items-center gap-2">
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2L38 20L20 38L2 20L20 2Z" fill="hsl(217, 90%, 40%)" stroke="hsl(217, 90%, 20%)" strokeWidth="1.5"/>
      <text x="20" y="17" textAnchor="middle" fill="white" fontSize="6" fontWeight="700" fontFamily="DM Sans">SPENDLEX</text>
      <path d="M13 22L17 26L27 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="text-xl font-bold text-foreground">Spendlex</span>
  </div>
);

export default SpendlexLogo;
