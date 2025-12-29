interface ErrorMessageProps {
  message?: string;
}

export default function ErrorMessage({ message = 'Something went wrong' }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-error text-lg font-semibold mb-2">{message}</div>
        <p className="text-text-secondary text-sm">Please try again later</p>
      </div>
    </div>
  );
}
