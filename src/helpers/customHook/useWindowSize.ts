import { useLayoutEffect, useState } from "react";

export const useWindowSize = () => {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
};

export const useIsMobile = (width: number) => {
  const [result, setResult] = useState(false);
  useLayoutEffect(() => {
    function updateSize() {
      const isMobile = window.innerWidth <= width;
      if (result !== isMobile) {
        setResult(isMobile);
      }
    }
    window.addEventListener("resize", updateSize, true);
    updateSize();
    return () => window.removeEventListener("resize", updateSize, true);
  }, [result, width]);
  return result;
};
