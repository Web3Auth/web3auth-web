import { useEffect, useMemo, useState } from "react";

import { cn } from "../../utils";
import { ModalProps } from "./Modal.type";

/**
 * Modal component
 * @param props - ModalProps
 * @returns Modal component
 */
function Modal(props: ModalProps) {
  const {
    children,
    open,
    onClose,
    placement = "center",
    padding = true,
    shadow = true,
    border = false,
    showCloseIcon = true,
    borderRadius = "large",
  } = props;

  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // Give a very small delay for the animation to start from the correct position
      setTimeout(() => {
        setIsOpen(true);
      }, 50);
    } else {
      setIsOpen(false);
      // Remove overflow styling to enable scroll again.
      document.body.style.overflow = "";
    }
  }, [open]);

  const positions: Record<string, string> = useMemo(
    () => ({
      center: "w3a--top-0 w3a--left-0 w3a--items-center w3a--justify-center",
      "top-center": "w3a--top-8 w3a--left-0 w3a--items-start w3a--justify-center",
      "bottom-center": "w3a--bottom-8 w3a--left-0 w3a--items-end w3a--justify-center",
      left: "sm:w3a--left-8 w3a--flex w3a--items-center w3a--justify-center sm:w3a--justify-start",
      right: "sm:w3a--right-8 w3a--flex w3a--items-center w3a--justify-center sm:w3a--justify-end",
    }),
    []
  );

  const placementClass = useMemo(() => positions[placement as string], [placement, positions]);

  const onCloseHandler = () => {
    if (onClose) onClose();
  };

  return (
    <div
      className={cn("w3a--fixed w3a--z-50 w3a--overflow-hidden w3a--flex w3a--transition-all", placementClass, {
        "w3a--w-screen w3a--h-screen": isOpen,
        "w3a--w-0 w3a--h-0 w3a--delay-500": !isOpen,
      })}
    >
      <div
        className={cn(
          "w3a--bg-app-light-surface1 dark:w3a--bg-app-dark-surface-main w3a--w-[356px] [@media(min-width:375px)]:w3a--w-[393px] w3a--h-auto w3a--flex w3a--flex-col w3a--duration-500",
          {
            "w3a--translate-y-0 w3a--delay-100": isOpen,
            "w3a--translate-y-[100vh]": !isOpen,
            "w3a--p-4": padding,
            "w3a--shadow-xl sm:w3a--shadow-lg": shadow,
            "w3a--border w3a--border-app-gray-100 dark:w3a--border-app-gray-800": border,
            "w3a--rounded-[30px]": borderRadius === "large",
            "w3a--rounded-2xl": borderRadius === "medium",
            "w3a--rounded-none": borderRadius === "small",
          }
        )}
      >
        {showCloseIcon && (
          <div className="w3a--absolute w3a--right-6 w3a--top-[30px] w3a--z-10 w3a--cursor-pointer">
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onClick={onCloseHandler}
              className="w3a--text-app-gray-500 hover:w3a--text-app-gray-900 dark:w3a--text-app-gray-200 dark:hover:w3a--text-app-white"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.292787 1.29299C0.480314 1.10552 0.734622 1.0002 0.999786 1.0002C1.26495 1.0002 1.51926 1.10552 1.70679 1.29299L5.99979 5.58599L10.2928 1.29299C10.385 1.19748 10.4954 1.1213 10.6174 1.06889C10.7394 1.01648 10.8706 0.988893 11.0034 0.987739C11.1362 0.986585 11.2678 1.01189 11.3907 1.06217C11.5136 1.11245 11.6253 1.1867 11.7192 1.28059C11.8131 1.37449 11.8873 1.48614 11.9376 1.60904C11.9879 1.73193 12.0132 1.86361 12.012 1.99639C12.0109 2.12917 11.9833 2.26039 11.9309 2.38239C11.8785 2.5044 11.8023 2.61474 11.7068 2.70699L7.41379 6.99999L11.7068 11.293C11.8889 11.4816 11.9897 11.7342 11.9875 11.9964C11.9852 12.2586 11.88 12.5094 11.6946 12.6948C11.5092 12.8802 11.2584 12.9854 10.9962 12.9877C10.734 12.9899 10.4814 12.8891 10.2928 12.707L5.99979 8.41399L1.70679 12.707C1.51818 12.8891 1.26558 12.9899 1.00339 12.9877C0.741188 12.9854 0.490376 12.8802 0.304968 12.6948C0.11956 12.5094 0.0143906 12.2586 0.0121121 11.9964C0.00983372 11.7342 0.110629 11.4816 0.292787 11.293L4.58579 6.99999L0.292787 2.70699C0.105316 2.51946 0 2.26515 0 1.99999C0 1.73483 0.105316 1.48052 0.292787 1.29299V1.29299Z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default Modal;
