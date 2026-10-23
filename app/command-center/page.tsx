{registryState === 'AUTH_REQUIRED' && (
  <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm">
    <div>
      <h2 className="text-sm font-bold text-amber-900">
        Authentication Required
      </h2>
      <p className="text-xs text-amber-800 mt-0.5">
        Sign in with your administrator credentials to verify tenant access and load your authorized client portfolio.
      </p>
    </div>
    <Link
      href="/login"
      className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#16325B] text-white font-bold text-xs rounded-lg shrink-0"
    >
      Sign In Now →
    </Link>
  </div>
)}
