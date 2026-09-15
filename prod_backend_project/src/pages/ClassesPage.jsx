const ClassesPage = () => {
  const classItems = [
    'Music Fundamentals',
    'Piano Beginner',
    'Guitar Advanced',
    'Vocal Essentials',
    'Drum Basics',
  ];

  return (
    <div className="page-container classes-page">
      <div className="classes-simple-header">
        <h2>Classes</h2>
      </div>

      <div className="class-list">
        {classItems.map((item) => (
          <div key={item} className="class-item">
            <span>{item}</span>
            <button type="button">View</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassesPage;
