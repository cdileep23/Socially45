"use client";
import { createComment, deletePost, getPosts, toggleLike } from '@/actions/post.action';
import { useUser } from '@clerk/nextjs';
import { Prisma } from '@prisma/client';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { HeartIcon, MessageCircleIcon, SendIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { SignInButton } from '@clerk/nextjs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type Posts = Awaited<ReturnType<typeof getPosts>>; // Post[] | undefined
type Post = NonNullable<Posts>[number]; // Ensures we exclude undefined


export const PostCard = ({ post, dbUserId }: { post: Post; dbUserId: string | null }) => {
  const { user } = useUser();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasLiked, setHasLiked] = useState(post.likes.some(like => like.userId === dbUserId));
  const [likes, setLikes] = useState(post._count?.likes || 0);
  const [comments, setComments] = useState(post._count?.comments || 0);

  const handleLike = async () => {
    if (isLiking || !dbUserId) return;
    
    try {
      setIsLiking(true);
     
      const newLikeStatus = !hasLiked;
      setHasLiked(newLikeStatus);
      setLikes(prev => newLikeStatus ? prev + 1 : prev - 1);
      
      await toggleLike(post.id);
    } catch (error) {

      setLikes(post._count.likes);
      setHasLiked(post.likes.some(like => like.userId === dbUserId));
      toast.error("Failed to toggle like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    
    try {
      setIsCommenting(true);
      const result = await createComment(post.id, newComment);
      
      if (result?.success) {
        toast.success("Comment posted successfully");
        setNewComment("");
        setComments(prev => prev + 1);
      } else {
        throw new Error(result?.error || "Failed to post comment");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      const result = await deletePost(post.id);
      
      if (result.success) {
        toast.success("Post deleted successfully");
        // You might want to add a callback here to remove the post from the UI
      } else {
        throw new Error(result.error || "Failed to delete post");
      }
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Post Header */}
          <div className="flex space-x-3 sm:space-x-4">
            <Link href={`/profile/${post.author.username}`}>
              <Avatar className="size-8 sm:w-10 sm:h-10">
                <AvatarImage 
                  src={post.author.image ?? "/avatar.png"} 
                  alt={post.author.name || "User avatar"}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/avatar.png";
                  }}
                />
              </Avatar>
            </Link>

            {/* Post Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 truncate">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="font-semibold truncate hover:underline"
                  >
                    {post.author.name}
                  </Link>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Link 
                      href={`/profile/${post.author.username}`}
                      className="hover:underline"
                    >
                      @{post.author.username}
                    </Link>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                  </div>
                </div>
                
                {/* Delete Button (only for post author) */}
                
                {dbUserId === post.authorId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                  >
                    <TrashIcon color='grey' className="size-4" size={20} />
                  </Button>
                )}
              </div>
              <p className="mt-2 text-sm text-foreground break-words whitespace-pre-line">
                {post.content}
              </p>
            </div>
          </div>

          {/* Post Image */}
          {post.image && (
            <div className="rounded-lg overflow-hidden border">
              <img 
                src={post.image} 
                alt="Post content" 
                className="w-full h-auto object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center pt-2 space-x-4">
            {/* Like Button */}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${hasLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}`}
                onClick={handleLike}
                disabled={isLiking}
              >
                {hasLiked ? (
                  <HeartIcon className="size-5 fill-current" />
                ) : (
                  <HeartIcon className="size-5" />
                )}
                <span>{likes}</span>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <HeartIcon className="size-5" />
                  <span>{likes}</span>
                </Button>
              </SignInButton>
            )}

            {/* Comment Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${showComments ? "text-blue-500 hover:text-blue-600" : "text-muted-foreground hover:text-blue-500"}`}
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircleIcon className="size-5" />
              <span>{comments}</span>
            </Button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="space-y-4 pt-4 border-t">
              {/* Existing Comments */}
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="size-8 flex-shrink-0">
                      <AvatarImage 
                        src={comment.author.image ?? "/avatar.png"} 
                        alt={comment.author.name || "Commenter avatar"}
                      />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium text-sm">{comment.author.name}</span>
                        <span className="text-sm text-muted-foreground">
                          @{comment.author.username}
                        </span>
                        <span className="text-sm text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt))} ago
                        </span>
                      </div>
                      <p className="text-sm break-words whitespace-pre-line">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment Form */}
              {user ? (
                <div className="flex space-x-3">
                  <Avatar className="size-8 flex-shrink-0">
                    <AvatarImage src={user.imageUrl} alt="Your avatar" />
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        className="flex items-center gap-2"
                        disabled={!newComment.trim() || isCommenting}
                      >
                        {isCommenting ? (
                          "Posting..."
                        ) : (
                          <>
                            <SendIcon className="size-4" />
                            Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                  <SignInButton mode="modal">
                    <Button variant="outline" className="gap-2">
                      <MessageCircleIcon className="size-4" />
                      Sign in to comment
                    </Button>
                  </SignInButton>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};