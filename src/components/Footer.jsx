export default function Footer(){
  return (
    <footer className="bg-slate-800 text-slate-200 py-6">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">© {new Date().getFullYear()} KarnatakaMatch — simplified demo. For accurate charts integrate an ephemeris.</p>
      </div>
    </footer>
  )
}
