'use client';

import React, { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/lib/apiClient'; 
import useAuthStore from '@/store/authStore';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import {
  MDXEditor,
  MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  imagePlugin,
  toolbarPlugin,
  linkDialogPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertImage
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface OssPresignedPostData {
  accessid: string; // Aliyun AccessKeyId
  policy: string;   // Base64 encoded policy
  signature: string;
  dir: string;      // Directory prefix in OSS (e.g., "article-covers/")
  key: string;      // Full object key/path in OSS (e.g., "article-covers/uuid-filename.jpg")
  host: string;     // OSS endpoint to POST to (e.g., "https://your-bucket.oss-your-region.aliyuncs.com")
  expire: string;   // Expiration timestamp (string or number)
  'Content-Type'?: string; 
}

export default function PublishArticlePage() {
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<MDXEditorMethods>(null);
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) {
    router.push('/sign-in'); // Redirect if not authenticated
    return <div>Redirecting...</div>; // Loading state or placeholder
  }

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCoverImage(null);
      setCoverImagePreview(null);
    }
  };

  const uploadToOss = async (file: File, type: 'cover' | 'content'): Promise<string> => {
    const uploadDir = type === 'cover' ? 'article-covers/' : 'article-content-images/';

    // 1. 从后端获取预签名的POST数据
    const sigData = await post<OssPresignedPostData, { filename: string; contentType: string; uploadDir: string }>(
      '/auth/oss/generate-presigned-post', 
      {
        filename: file.name,
        contentType: file.type,
        uploadDir: uploadDir,
      }
    );

    console.log('Raw response from /auth/oss/generate-presigned-post:', sigData); 

    // 验证响应结构
    if (!sigData || !sigData.host || !sigData.key || !sigData.policy || !sigData.accessid || !sigData.signature) {
      console.error('Invalid or incomplete OSS signature data received from backend:', sigData);
      throw new Error('Failed to get valid OSS signature data. Check backend logs for /auth/oss/generate-presigned-post.');
    }

    // 2. 准备FormData用于阿里云OSS
    const ossFormData = new FormData();
    ossFormData.append('key', sigData.key); // Full path for the object in OSS
    ossFormData.append('policy', sigData.policy);
    ossFormData.append('OSSAccessKeyId', sigData.accessid); // Map 'accessid' to 'OSSAccessKeyId'
    ossFormData.append('signature', sigData.signature);
    
    if (sigData['Content-Type']) {
      ossFormData.append('Content-Type', sigData['Content-Type']);
    }

    ossFormData.append('file', file); // IMPORTANT: File must be the last field for OSS POST

    // 3. 发送POST请求到阿里云OSS
    const ossResponse = await fetch(sigData.host, {
      method: 'POST',
      body: ossFormData,
      // Do NOT set Content-Type header for FormData; the browser sets it with the correct boundary.
      // `credentials: 'omit'` is the default for fetch if not on the same origin, which is correct for OSS.
    });

    if (!ossResponse.ok) {
      let ossErrorText = `OSS upload failed: ${ossResponse.status} ${ossResponse.statusText}`;
      try {
        const errorXml = await ossResponse.text();
        console.error('OSS Upload Error XML:', errorXml);
        ossErrorText += ' (See browser console for OSS error details)';
      } catch (e) {
        console.warn('Could not read OSS error response body', e);
      }
      throw new Error(ossErrorText);
    }

    // 4. 返回图片资源的URL
    const imageUrl = `${sigData.host.replace(/\/$/, '')}/${sigData.key.replace(/^\//, '')}`;
    console.log(`Image uploaded to OSS successfully: ${imageUrl} (type: ${type})`);
    return imageUrl;
  };

  const imageUploadHandler = async (image: File): Promise<string> => {
    setError(null); // Clear previous errors
    try {
      return await uploadToOss(image, 'content');
    } catch (uploadError: unknown) {
      console.error('Error during OSS image upload process (content image):', uploadError);
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'An unknown error occurred during image upload.';
      setError(`Content image upload failed: ${errorMessage}. Please ensure your backend signature service is running correctly.`);
      toast.error(`内容图片上传失败: ${errorMessage}`);
      throw new Error(`Content image upload failed: ${errorMessage}`); 
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const content = editorRef.current?.getMarkdown();

    if (!title.trim()) {
      setError('Article title cannot be empty.');
      setIsLoading(false);
      return;
    }
    if (!coverImage) {
      setError('Cover image is required.');
      setIsLoading(false);
      return;
    }
    if (!content || !content.trim()) {
      setError('Article content cannot be empty.');
      setIsLoading(false);
      return;
    }
    
    // 上传封面图片到阿里云OSS，只将可访问的URL返回到后端存储
    let uploadedCoverImageUrl: string | null = null;
    if (coverImage) {
      try {
        console.log('Uploading cover image to Aliyun OSS...');
        uploadedCoverImageUrl = await uploadToOss(coverImage, 'cover');
      } catch (uploadError: unknown) {
        console.error('Error uploading cover image to Aliyun OSS:', uploadError);
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'An unknown error occurred during cover image upload.';
        setError(`Failed to upload cover image: ${errorMessage}. Please ensure your backend signature service is running correctly.`);
        toast.error(`封面上传失败: ${errorMessage}`);
        setIsLoading(false);
        return;
      }
    }

    if (!uploadedCoverImageUrl) {
        setError('Cover image is required and failed to upload. Please try again.');
        setIsLoading(false)
        return;
    }

    const articleData = {
        title: title,
        content: content,
        coverImageUrl: uploadedCoverImageUrl, 
    };
    
    try {
      console.log('Submitting article data to backend...');
      await post('/articles/new', articleData);
      
      toast.success('Article published successfully!');
      router.refresh(); // 添加此行以刷新服务器数据
      router.push('/'); // 然后跳转到首页
    } catch (err: unknown) {
      console.error('Error publishing article:', err);
      const finalError = err instanceof Error ? err.message : 'Failed to publish article.';
      setError(finalError || 'An unknown error occurred. Please try again.');
      toast.error(finalError || 'An unknown error occurred publishing the article.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:w-full sm:max-w-5xl">
        <h2 className="mt-6 text-3xl font-extrabold text-neutral-900">
          发布新通知/推文
        </h2>
      </div>

      <div className="mt-8 sm:w-full sm:max-w-5xl">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    {/* SVG Icon */}
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-700 pb-1">
                文章标题（必填）
              </label>
              <div className="mt-1">
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-500 text-neutral-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter article title"
                />
              </div>
            </div>

            {/* Cover Image Upload Section */}
            <div className="mt-6">
              <label htmlFor="cover-image" className="block text-sm font-medium text-neutral-700 pb-1">
                封面图片（必填）
              </label>
              <input
                id="cover-image"
                name="cover-image"
                type="file"
                accept="image/*"
                required
                onChange={handleCoverImageChange}
                className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-500 text-neutral-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
              {coverImagePreview && (
                <div className="mt-4 relative w-full max-w-xs h-60">
                  <Image 
                    src={coverImagePreview} 
                    alt="Cover image preview" 
                    layout="fill"
                    objectFit="contain"
                    className="rounded-md shadow-md" 
                  />
                </div>
              )}
            </div>
            {/* End Cover Image Upload Section */}

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-neutral-700 pb-1 pt-4">
                文章内容（必填）
              </label>
              <div className="mt-1 prose-sm max-w-none prose-neutral dark:prose-invert">
                <MDXEditor
                  ref={editorRef}
                  markdown={''} // Initial markdown content
                  contentEditableClassName="editor-content" // Add your custom class here
                  plugins={[
                    headingsPlugin(), 
                    listsPlugin(), 
                    quotePlugin(), 
                    thematicBreakPlugin(), 
                    markdownShortcutPlugin(),
                    imagePlugin({ imageUploadHandler }), // This now uses the updated OSS uploader
                    linkDialogPlugin(),
                    toolbarPlugin({
                      toolbarContents: () => (
                        <>
                          <UndoRedo />
                          <BoldItalicUnderlineToggles />
                          <BlockTypeSelect />
                          <ListsToggle />
                          <CreateLink />
                          <InsertImage />
                        </>
                      )
                    })
                  ]}
                  placeholder="Write your article content here..."
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Publishing...' : 'Publish Article'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
