import Image from "next/image";

export const GuaranteeHeroBanner = ({ src }: { src?: string | null }) => {
  if (!src) return null;
  return (
    <div className="w-full flex justify-center mb-6 md:mb-8">
      <Image
        src={src}
        alt="공식보증업체"
        width={1200}
        height={300}
        className="w-full max-w-4xl object-contain rounded-lg"
        unoptimized
        priority
      />
    </div>
  );
};
