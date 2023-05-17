const LetterProfilePicture = ({ letter }: { letter: string }) => {
  return (
    <div className="flex items-center">
      <div className="relative">
        <div className="notion-record-icon notranslate flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-200 uppercase text-gray-600">
            <div className="h-6 text-base">{letter}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterProfilePicture;
