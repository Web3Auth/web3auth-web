import { createSignal, For } from "solid-js"
import { SocialLoginButton } from "../SocialLoginButton"
import { cn } from "../../utils/common";


const SocialLoginList = () => {

  const loginMethods = () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  const firstRow = loginMethods().slice(0, 3);
  const otherRow = loginMethods().slice(3);

  const [expand, setExpand] = createSignal(false)

  const handleExpand = () => {
    setExpand((prev) => !prev)
  }

  return (

    <div class="flex flex-col w-full gap-y-2">
      <SocialLoginButton />
      <div class="grid grid-cols-3 gap-x-2 gap-y-2">
        <For each={firstRow}>
          {(_) =>
            <SocialLoginButton showText={false} />
          }
        </For>
      </div>
      {/* 224px */}
      <div class={cn('grid grid-cols-3 gap-x-2 gap-y-2 overflow-hidden transition-all duration-700 ease-linear',
        { 'max-h-[192px]': expand(), 'max-h-0': !expand() })}>
        <For each={otherRow}>
          {(_) =>
            <SocialLoginButton showText={false} />
          }
        </For>
      </div>
      <p class="text-xs font-normal text-app-gray-500 text-start">We do not store any data related to your social logins.</p>
      <button type="button" class="text-xs font-normal text-app-primary-600 hover:text-app-primary-500 dark:text-app-primary-500 dark:hover:text-app-primary-600 text-right" onClick={handleExpand}>View More</button>
    </div>
  )
}

export default SocialLoginList