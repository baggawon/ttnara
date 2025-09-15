import Image from "next/image";

export const CertifiedTraderBadge = ({ className }: { className?: string }) => {
  const badgeName = "certified.png";
  const name = badgeName.split(".")[0];
  const imageUrl = `/badge/${badgeName}`;

  return (
    <Image
      src={imageUrl}
      alt={`${name} rank badge`}
      width={24}
      height={24}
      className={`w-6 h-6 ${className || ""}`}
    />
  );
};
