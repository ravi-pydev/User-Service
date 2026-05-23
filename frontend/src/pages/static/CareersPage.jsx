const ROLES = [
  { title: 'Senior Frontend Engineer', team: 'Engineering', location: 'Remote' },
  { title: 'Product Designer', team: 'Design', location: 'Remote' },
  { title: 'Customer Success Manager', team: 'Support', location: 'Remote / Hybrid' },
];

export default function CareersPage() {
  return (
    <div className="static-page">
      <div className="static-page__inner">
        <h1 className="static-page__title">Careers</h1>
        <p className="static-page__lead">
          Join a small, fully remote team building tools that millions of people use every day.
        </p>
        <section className="static-page__section">
          <h2>Open Roles</h2>
          <div className="static-page__card-list">
            {ROLES.map((role) => (
              <div key={role.title} className="static-page__card">
                <h3 className="static-page__card-title">{role.title}</h3>
                <p>{role.team} · {role.location}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="static-page__section">
          <h2>Don't see your role?</h2>
          <p>
            We're always looking for talented people. Send your CV to 
            <strong><a href="mailto:ravidarshan@formforge.in">ravidarshan@formforge.in</a></strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
