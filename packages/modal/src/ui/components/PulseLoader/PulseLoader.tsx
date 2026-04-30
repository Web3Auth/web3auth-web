const PulseLoader = () => {
  return (
    <div className="wta:flex wta:items-center wta:justify-center wta:gap-x-2">
      <div className="wta:size-3 wta:animate-pulse wta:rounded-full wta:bg-app-gray-500 wta:dark:bg-app-gray-200" />
      <div className="wta:size-3 wta:animate-pulse wta:rounded-full wta:bg-app-gray-400 wta:dark:bg-app-gray-400" />
      <div className="wta:size-3 wta:animate-pulse wta:rounded-full wta:bg-app-gray-200 wta:dark:bg-app-gray-600" />
    </div>
  );
};

export default PulseLoader;
