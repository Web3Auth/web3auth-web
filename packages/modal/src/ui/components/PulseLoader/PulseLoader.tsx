const PulseLoader = () => {
  return (
    <div className="w3a--flex w3a--items-center w3a--justify-center w3a--gap-x-2">
      <div className="w3a--size-3 w3a--animate-pulse w3a--rounded-full w3a--bg-app-gray-500 dark:w3a--bg-app-gray-200" />
      <div className="w3a--size-3 w3a--animate-pulse w3a--rounded-full w3a--bg-app-gray-400 dark:w3a--bg-app-gray-400" />
      <div className="w3a--size-3 w3a--animate-pulse w3a--rounded-full w3a--bg-app-gray-200 dark:w3a--bg-app-gray-600" />
    </div>
  );
};

export default PulseLoader;
