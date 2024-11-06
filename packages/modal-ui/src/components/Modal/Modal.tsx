import { Component, JSX, createSignal, createEffect, mergeProps } from "solid-js";
import { cn } from "../../utils/common";

export interface ModalProps {
  children: JSX.Element[] | JSX.Element;
  open: boolean;
  onClose?: () => void;
  placement?: 'center' | 'top-center' | 'bottom-center' | 'left' | 'right';
  padding?: boolean;
  shadow?: boolean;
  border?: boolean;
  showCloseIcon?: boolean;
}

const Modal: Component<ModalProps> = (props: ModalProps) => {

  const mergedProps = mergeProps({ open: false, padding: true, placement: 'center', shadow: true, border: true, showCloseIcon: false }, props as ModalProps);

  const [isOpen, setIsOpen] = createSignal<boolean>(false);

  createEffect(() => {
    if (mergedProps.open) {
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
  }, false);


  const onCloseHandler = () => {
    if (mergedProps.onClose) mergedProps.onClose()
  };

  const positions: Record<string, string> = {
    'center': 'top-0 left-0 items-center justify-center',
    'top-center': 'top-8 left-0 items-start justify-center',
    'bottom-center': 'bottom-8 left-0 items-end justify-center',
    'left': 'sm:left-8 flex items-center justify-center sm:justify-start',
    'right': 'sm:right-8 flex items-center justify-center sm:justify-end',
  };

  const placementClass = positions[mergedProps.placement as string]

  return (
    <div
      class={cn('fixed z-50 overflow-hidden flex transition-all', placementClass, {
        "w-screen h-screen": isOpen(),
        "w-0 h-0 delay-500": !isOpen(),
      })}
    >
      <div
        class={cn('bg-app-white rounded-3xl w-full sm:w-[400px] duration-500', {
          "translate-y-0 delay-100": isOpen(),
          "translate-y-[100vh]": !isOpen(),
          "p-4": mergedProps.padding,
          "shadow-xl sm:shadow-lg": mergedProps.shadow,
          "border border-app-gray-100": mergedProps.border
        })}
      >
        {mergedProps.showCloseIcon && <div class="absolute right-6 top-[30px] cursor-pointer">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" onClick={onCloseHandler}>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M0.292787 1.29299C0.480314 1.10552 0.734622 1.0002 0.999786 1.0002C1.26495 1.0002 1.51926 1.10552 1.70679 1.29299L5.99979 5.58599L10.2928 1.29299C10.385 1.19748 10.4954 1.1213 10.6174 1.06889C10.7394 1.01648 10.8706 0.988893 11.0034 0.987739C11.1362 0.986585 11.2678 1.01189 11.3907 1.06217C11.5136 1.11245 11.6253 1.1867 11.7192 1.28059C11.8131 1.37449 11.8873 1.48614 11.9376 1.60904C11.9879 1.73193 12.0132 1.86361 12.012 1.99639C12.0109 2.12917 11.9833 2.26039 11.9309 2.38239C11.8785 2.5044 11.8023 2.61474 11.7068 2.70699L7.41379 6.99999L11.7068 11.293C11.8889 11.4816 11.9897 11.7342 11.9875 11.9964C11.9852 12.2586 11.88 12.5094 11.6946 12.6948C11.5092 12.8802 11.2584 12.9854 10.9962 12.9877C10.734 12.9899 10.4814 12.8891 10.2928 12.707L5.99979 8.41399L1.70679 12.707C1.51818 12.8891 1.26558 12.9899 1.00339 12.9877C0.741188 12.9854 0.490376 12.8802 0.304968 12.6948C0.11956 12.5094 0.0143906 12.2586 0.0121121 11.9964C0.00983372 11.7342 0.110629 11.4816 0.292787 11.293L4.58579 6.99999L0.292787 2.70699C0.105316 2.51946 0 2.26515 0 1.99999C0 1.73483 0.105316 1.48052 0.292787 1.29299V1.29299Z" fill="#6B7280" />
          </svg>
        </div>}
        {mergedProps.children}
      </div>
    </div >

  );
};

export default Modal;