import { cn } from "../../utils";
import { BottomSheetProps } from "./BottomSheet.type";
/**
 * BottomSheet component
 * @returns BottomSheet component
 */
function BottomSheet({ isShown, onClose, children, sheetClassName, showCloseButton = true, borderRadiusType = "large" }: BottomSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn("w3a--bottom-sheet-bg w3a--fixed w3a--left-0 w3a--top-0 w3a--size-full w3a--transition-opacity w3a--duration-300", {
          "w3a--rounded-[30px]": borderRadiusType === "large",
          "w3a--rounded-2xl": borderRadiusType === "medium",
          "w3a--rounded-none": borderRadiusType === "small",
        })}
        onClick={onClose}
        aria-hidden="true"
        role="button"
      />
      {/* Bottom Sheet */}
      <div
        className={cn(
          `w3a--fixed w3a--bottom-2 w3a--left-2 w3a--mx-auto w3a--flex w3a--w-[96%] w3a--flex-col 
      w3a--gap-y-2 w3a--border w3a--border-app-gray-100 w3a--bg-app-white w3a--p-4 w3a--shadow-lg w3a--transition-transform w3a--duration-500 
      w3a--ease-out dark:w3a--border-app-gray-600 dark:w3a--bg-app-dark-surface-main
      ${isShown ? "w3a--translate-y-0 w3a--delay-700" : "w3a--translate-y-full"}`,
          {
            "w3a--rounded-[30px]": borderRadiusType === "large",
            "w3a--rounded-2xl": borderRadiusType === "medium",
            "w3a--rounded-none": borderRadiusType === "small",
          },
          sheetClassName
        )}
      >
        {showCloseButton && (
          <div className="w3a--absolute w3a--right-4 w3a--top-[16px] w3a--z-10 w3a--cursor-pointer">
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onClick={onClose}
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
    </>
  );
}

export default BottomSheet;
