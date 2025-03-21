export function ProgressBar({ percent }: { percent: number }) {
    return (
      <div className="w-full bg-gray-700 rounded-full h-6">
        <div
          className="bg-green-500 h-6 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    )
  }
  