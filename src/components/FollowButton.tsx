"use client"
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { toggleFollow } from '@/actions/user.action'

const FollowButton = ({userId}:{userId:string}) => {
    const[isLoading,setLoading]=useState(false)

     const HandleFolow=async()=>{
        setLoading(true)

        try {
            await toggleFollow(userId);
            toast.success("User Successfully Followed")
        } catch (error) {
            console.log("Error following User",error)
            toast.error("Error following User")
        }
     }

  return (
    <div>
      <Button size={'sm'}disabled={isLoading} variant={'secondary'} className='w-20' onClick={HandleFolow}>
        {isLoading? <Loader2Icon className='size-4 animate-spin'/>:"Follow"}
      </Button>
    </div>
  )
}

export default FollowButton
