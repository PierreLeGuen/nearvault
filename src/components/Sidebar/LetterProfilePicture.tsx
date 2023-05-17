const LetterProfilePicture = ({ letter }: { letter: string }) => {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-200 font-bold uppercase text-gray-600">
      {letter}
    </div>
  );
};

export default LetterProfilePicture;
