export default function DeveloperFooter() {
  return (
    <footer className="h-12 px-4 md:px-8 shrink-0 flex items-center justify-between border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-[#17181b] z-50 font-mono">
      <div className="flex items-center space-x-4 text-[10px] text-gray-500 uppercase font-bold">
        <span className="hidden sm:inline">Version 1.0.4-Beta</span>
        <span className="hidden sm:inline">•</span>
        <span>Project ID: dino-multiplayer-85737</span>
      </div>
      <a 
        href="https://github.com/nemo7890"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center space-x-2 text-xs hover:text-black dark:hover:text-white transition-colors"
      >
        <span className="text-gray-500 uppercase">Developer:</span>
        <span className="font-bold">Argha</span>
        <div className="w-6 h-6 bg-gray-200 dark:bg-[#535353] rounded-full group-hover:bg-gray-300 dark:group-hover:bg-white flex items-center justify-center transition-colors">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black dark:fill-[#17181b]">
            <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.49,20.14 9.49,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.49,20.68 14.49,21C14.49,21.27 14.65,21.59 15.16,21.5C19.13,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z" />
          </svg>
        </div>
      </a>
    </footer>
  );
}
