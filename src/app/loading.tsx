import Loader from "@/components/1_atoms/Loader";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="relative w-screen h-screen">
      <Loader />
    </div>
  );
}
