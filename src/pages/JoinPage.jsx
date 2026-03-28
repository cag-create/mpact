import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../App'

export default function JoinPage() {
  const { slugOrId } = useParams()
  const { communities } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    const community = communities.find(
      c => c.slug === slugOrId || c.id === slugOrId
    )
    if (community) {
      navigate(`/community/${community.id}`, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }, [slugOrId, communities, navigate])

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm font-medium">Loading your community…</p>
      </div>
    </div>
  )
}
