import { useLayoutEffect, useState } from "react";

const useSize = (ref?: any) => {
  const [Size, setSize] = useState({ width: 0, height: 0 });

  const handleSize = () => {
    if (ref.current) {
      setSize({
        width: (ref.current as any).getBoundingClientRect().width,
        height: (ref.current as any).getBoundingClientRect().height,
      });
    } else {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  };

  useLayoutEffect(() => {
    handleSize();

    window.addEventListener("resize", handleSize);

    return () => window.removeEventListener("resize", handleSize);
  }, []);

  return Size;
};

export default useSize;
