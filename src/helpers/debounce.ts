const debounce = (
  func?: (data: any) => void,
  wait = 100,
  immediate?: boolean
) => {
  let timeout: any;
  let args: any;
  let context: any;
  let timestamp = 0;
  let result: any | undefined;

  function later() {
    const last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = typeof func === "function" ? func.apply(context, args) : func;
        context = null;
        args = null;
      }
    }
  }

  const debounced = function debounced(this: any) {
    context = this;
    args = arguments;
    timestamp = Date.now();
    const callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = typeof func === "function" ? func.apply(context, args) : func;
      context = null;
      args = null;
    }

    return result;
  };

  debounced.clear = function clear() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  debounced.flush = function flush() {
    if (timeout) {
      result = typeof func === "function" ? func.apply(context, args) : func;
      context = null;
      args = null;

      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
};

export default debounce;
