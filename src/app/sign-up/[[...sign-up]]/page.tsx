import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <SignUp />
    </div>
  )
}