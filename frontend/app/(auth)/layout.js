function AuthLayout({ children }) {
  return (
    <div className="page-frame flex min-h-[calc(100vh-12rem)] items-center justify-center py-12">
      <div className="section-shell w-full max-w-md p-4 sm:p-6">{children}</div>
    </div>
  );
}

export default AuthLayout;
