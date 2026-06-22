/*
  Project: Unfathomably Frontend
  ------------------------------

  File: src/features/federation/capability-chips.tsx

  Purpose:

    Render compact capability labels for federated groups, sources, and
    source preview items.

  Responsibilities:

    * show the interaction model reported by the backend
    * keep long capability lists visually small
    * ignore empty labels from older backend responses

  This file intentionally does NOT contain:

    * platform classification
    * follow or join actions
    * network requests
*/

interface ICapabilityChips {
  labels?: string[] | null;
}

const CapabilityChips: React.FC<ICapabilityChips> = ({ labels }) => {
  const visibleLabels = (labels || [])
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (!visibleLabels.length) {
    return null;
  }

  return (
    <div className='flex flex-wrap gap-1.5' data-testid='federation-capability-chips'>
      {visibleLabels.map((label) => (
        <span
          className='rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          key={label}
        >
          {label}
        </span>
      ))}
    </div>
  );
};

export default CapabilityChips;

/* end of src/features/federation/capability-chips.tsx */
