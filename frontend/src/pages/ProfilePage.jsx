import { useAuth } from "../context/AuthContext"

function ProfilePage() {
  const { user } = useAuth()

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <p className="eyebrow">Authenticated Area</p>
        <h1>Profile</h1>
      </div>
      <div className="profile-card">
        <h2>Account Details</h2>
        <dl>
          <dt>Email</dt>
          <dd>{user?.email ?? "Unknown"}</dd>
          <dt>Name</dt>
          <dd>{user?.name ?? "Not set"}</dd>
        </dl>
      </div>
    </section>
  )
}

export default ProfilePage
