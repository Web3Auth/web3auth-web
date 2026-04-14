import { useEffect } from "react";

import { useToast } from "../../context/RootContext";
import { TOAST_TYPE } from "../../interfaces";

const Toast = () => {
  const { toast, setToast } = useToast();

  useEffect(() => {
    if (toast.message) {
      setTimeout(() => {
        setToast({ message: "", type: TOAST_TYPE.SUCCESS });
      }, 3000);
    }
  }, [toast.message, setToast]);

  if (!toast.message) return null;

  const toastClass = {
    success: "w3a--border-app-green-200 w3a--bg-app-green-100 w3a--text-app-green-900",
    error: "w3a--border-app-red-200 w3a--bg-app-red-100 w3a--text-app-red-900",
    warning: "w3a--border-app-yellow-200 w3a--bg-app-yellow-100 w3a--text-app-yellow-900",
    info: "w3a--border-app-blue-200 w3a--bg-app-blue-100 w3a--text-app-blue-900",
  };

  const toastIconClass = {
    success: "w3a--text-app-green-900",
    error: "w3a--text-app-red-900",
    warning: "w3a--text-app-yellow-900",
    info: "w3a--text-app-blue-900",
  };

  return (
    <div
      className={`w3a--absolute w3a--inset-x-4 w3a--bottom-4 w3a--z-[60] w3a--mx-auto w3a--w-[90%] w3a--rounded-md w3a--border w3a--p-4 w3a--text-sm ${toastClass[toast.type]}`}
    >
      <div className="w3a--absolute w3a--right-4 w3a--top-4 w3a--z-10 w3a--cursor-pointer">
        <svg
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          onClick={() => setToast({ message: "", type: TOAST_TYPE.SUCCESS })}
          className={toastIconClass[toast.type]}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.292787 1.29299C0.480314 1.10552 0.734622 1.0002 0.999786 1.0002C1.26495 1.0002 1.51926 1.10552 1.70679 1.29299L5.99979 5.58599L10.2928 1.29299C10.385 1.19748 10.4954 1.1213 10.6174 1.06889C10.7394 1.01648 10.8706 0.988893 11.0034 0.987739C11.1362 0.986585 11.2678 1.01189 11.3907 1.06217C11.5136 1.11245 11.6253 1.1867 11.7192 1.28059C11.8131 1.37449 11.8873 1.48614 11.9376 1.60904C11.9879 1.73193 12.0132 1.86361 12.012 1.99639C12.0109 2.12917 11.9833 2.26039 11.9309 2.38239C11.8785 2.5044 11.8023 2.61474 11.7068 2.70699L7.41379 6.99999L11.7068 11.293C11.8889 11.4816 11.9897 11.7342 11.9875 11.9964C11.9852 12.2586 11.88 12.5094 11.6946 12.6948C11.5092 12.8802 11.2584 12.9854 10.9962 12.9877C10.734 12.9899 10.4814 12.8891 10.2928 12.707L5.99979 8.41399L1.70679 12.707C1.51818 12.8891 1.26558 12.9899 1.00339 12.9877C0.741188 12.9854 0.490376 12.8802 0.304968 12.6948C0.11956 12.5094 0.0143906 12.2586 0.0121121 11.9964C0.00983372 11.7342 0.110629 11.4816 0.292787 11.293L4.58579 6.99999L0.292787 2.70699C0.105316 2.51946 0 2.26515 0 1.99999C0 1.73483 0.105316 1.48052 0.292787 1.29299V1.29299Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="w3a--flex w3a--items-center w3a--gap-2">
        {/* TODO: add icon */}
        {/* <img src="" alt="toast-icon" /> */}
        {/* <p className={toastIconClass[toast.type]}>x</p> */}
        <p>{toast.message}</p>
      </div>
    </div>
  );
};

export default Toast;
