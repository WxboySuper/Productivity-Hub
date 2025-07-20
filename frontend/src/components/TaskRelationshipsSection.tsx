// Subcomponent for relationship buttons
interface RelationshipButtonsProps {
  blockedBy: number[];
  blocking: number[];
  linkedTasks: number[];
  onBlockedByClick: () => void;
  onBlockingClick: () => void;
  onLinkedClick: () => void;
}

function RelationshipButtons({ blockedBy, blocking, linkedTasks, onBlockedByClick, onBlockingClick, onLinkedClick }: RelationshipButtonsProps) {
  return (
    <div className="modern-relationship-buttons">
      <button
        type="button"
        className="modern-relationship-btn"
        onClick={onBlockedByClick}
        data-testid="blocked-by-btn"
        aria-label="Blocked By"
      >
        <span className="modern-relationship-btn-icon">🚫</span>
        <span className="modern-relationship-btn-text">Blocked By</span>
        {blockedBy.length > 0 && <span className="modern-relationship-btn-count">{blockedBy.length}</span>}
      </button>
      <button
        type="button"
        className="modern-relationship-btn"
        onClick={onBlockingClick}
        data-testid="blocking-btn"
        aria-label="Blocking"
      >
        <span className="modern-relationship-btn-icon">⛔</span>
        <span className="modern-relationship-btn-text">Blocking</span>
        {blocking.length > 0 && <span className="modern-relationship-btn-count">{blocking.length}</span>}
      </button>
      <button
        type="button"
        className="modern-relationship-btn"
        onClick={onLinkedClick}
        data-testid="linked-btn"
        aria-label="Linked Tasks"
      >
        <span className="modern-relationship-btn-icon">🔗</span>
        <span className="modern-relationship-btn-text">Linked Tasks</span>
        {linkedTasks.length > 0 && <span className="modern-relationship-btn-count">{linkedTasks.length}</span>}
      </button>
    </div>
  );
}
// Subcomponent for displaying relationship chips
interface RelationshipChipsDisplayProps {
  blockedBy: number[];
  blocking: number[];
  linkedTasks: number[];
  allTasks: DependencyTask[];
  onRemoveBlockedBy: (id: number) => void;
  onRemoveBlocking: (id: number) => void;
  onRemoveLinked: (id: number) => void;
}

function RelationshipChipsDisplay({ blockedBy, blocking, linkedTasks, allTasks, onRemoveBlockedBy, onRemoveBlocking, onRemoveLinked }: RelationshipChipsDisplayProps) {
  // Named handlers to avoid inline arrow functions in JSX
  function handleRemoveBlockedByClick(e: React.MouseEvent<HTMLButtonElement>) {
    const id = Number(e.currentTarget.getAttribute('data-taskid'));
    onRemoveBlockedBy(id);
  }
  function handleRemoveBlockingClick(e: React.MouseEvent<HTMLButtonElement>) {
    const id = Number(e.currentTarget.getAttribute('data-taskid'));
    onRemoveBlocking(id);
  }
  function handleRemoveLinkedClick(e: React.MouseEvent<HTMLButtonElement>) {
    const id = Number(e.currentTarget.getAttribute('data-taskid'));
    onRemoveLinked(id);
  }

  return (
    <div className="modern-relationship-display">
      {blockedBy.map((taskId: number) => {
        const task = allTasks.find((t: DependencyTask) => t.id === taskId);
        return task ? (
          <div key={`blocked-${taskId}`} className="modern-dependency-chip blocked-by">
            <span>🚫 {task.title}</span>
            <button
              type="button"
              data-taskid={taskId}
              onClick={handleRemoveBlockedByClick}
              className="modern-dependency-chip-remove"
            >
              ×
            </button>
          </div>
        ) : null;
      })}
      {blocking.map((taskId: number) => {
        const task = allTasks.find((t: DependencyTask) => t.id === taskId);
        return task ? (
          <div key={`blocking-${taskId}`} className="modern-dependency-chip blocking">
            <span>⛔ {task.title}</span>
            <button
              type="button"
              data-taskid={taskId}
              onClick={handleRemoveBlockingClick}
              className="modern-dependency-chip-remove"
            >
              ×
            </button>
          </div>
        ) : null;
      })}
      {linkedTasks.map((taskId: number) => {
        const task = allTasks.find((t: DependencyTask) => t.id === taskId);
        return task ? (
          <div key={`linked-${taskId}`} className="modern-dependency-chip linked">
            <span>🔗 {task.title}</span>
            <button
              type="button"
              data-taskid={taskId}
              onClick={handleRemoveLinkedClick}
              className="modern-dependency-chip-remove"
            >
              ×
            </button>
          </div>
        ) : null;
      })}
    </div>
  );
}
interface DependencyTask {
  id: number;
  title: string;
  projectId?: number;
}

interface TaskRelationshipsSectionProps {
  expanded: boolean;
  blockedBy: number[];
  blocking: number[];
  linkedTasks: number[];
  allTasks: DependencyTask[];
  onBlockedByClick: () => void;
  onBlockingClick: () => void;
  onLinkedClick: () => void;
  onRemoveBlockedBy: (id: number) => void;
  onRemoveBlocking: (id: number) => void;
  onRemoveLinked: (id: number) => void;
  onToggleExpand: () => void;
}

const TaskRelationshipsSection: React.FC<TaskRelationshipsSectionProps> = ({
  expanded,
  blockedBy,
  blocking,
  linkedTasks,
  allTasks,
  onBlockedByClick,
  onBlockingClick,
  onLinkedClick,
  onRemoveBlockedBy,
  onRemoveBlocking,
  onRemoveLinked,
  onToggleExpand,
}) => (
  <div className="modern-expandable">
    <button
      type="button"
      className={`modern-expandable-header ${expanded ? 'expanded' : ''}`}
      onClick={onToggleExpand}
      aria-label="Task Relationships"
    >
      <span className="modern-expandable-icon">▶️</span>
      <h3 className="modern-expandable-title">Task Relationships</h3>
      {(blockedBy.length > 0 || blocking.length > 0 || linkedTasks.length > 0) && (
        <span className="modern-expandable-count">
          ({blockedBy.length + blocking.length + linkedTasks.length} items)
        </span>
      )}
    </button>
    <div className={`modern-expandable-content ${expanded ? 'expanded' : ''}`}>
      <RelationshipButtons
        blockedBy={blockedBy}
        blocking={blocking}
        linkedTasks={linkedTasks}
        onBlockedByClick={onBlockedByClick}
        onBlockingClick={onBlockingClick}
        onLinkedClick={onLinkedClick}
      />
      <RelationshipChipsDisplay
        blockedBy={blockedBy}
        blocking={blocking}
        linkedTasks={linkedTasks}
        allTasks={allTasks}
        onRemoveBlockedBy={onRemoveBlockedBy}
        onRemoveBlocking={onRemoveBlocking}
        onRemoveLinked={onRemoveLinked}
      />
    </div>
  </div>
);

export default TaskRelationshipsSection;
