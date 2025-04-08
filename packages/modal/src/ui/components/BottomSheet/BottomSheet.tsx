import { BottomSheetProps } from "./BottomSheet.type";
/**
 * BottomSheet component
 * @returns BottomSheet component
 */
function BottomSheet({ isShown, onClose, children }: BottomSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="w3a--bottom-sheet-bg w3a--fixed w3a--left-0 w3a--top-0 w3a--size-full w3a--transition-opacity w3a--duration-300"
        onClick={onClose}
        aria-hidden="true"
        role="button"
      />
      {/* Bottom Sheet */}
      <div
        className={`w3a--fixed w3a--bottom-0 w3a--left-0 w3a--flex w3a--w-full w3a--flex-col 
        w3a--gap-y-2 w3a--rounded-t-3xl w3a--border w3a--border-app-gray-100 w3a--bg-app-light-surface-main w3a--p-4 w3a--shadow-lg w3a--transition-transform 
        w3a--duration-500 w3a--ease-out dark:w3a--border-app-gray-600 dark:w3a--bg-app-dark-surface-main
        ${isShown ? "w3a--translate-y-0 w3a--delay-700" : "w3a--translate-y-full"}`}
      >
        {/* Drag Handle */}
        <div
          className="w3a--mx-auto w3a--h-1 w3a--w-16 w3a--cursor-pointer w3a--rounded-full w3a--bg-app-gray-200 
dark:w3a--bg-app-gray-700"
          onClick={onClose}
          aria-hidden="true"
          role="button"
        />
        {children}
      </div>
    </>
  );
}

export default BottomSheet;
