import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, User, ArrowRight, Heart, MessageCircle } from 'lucide-react';
import { Card, Button, Badge } from '../ui';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
  readTime: string;
  category: string;
  image: string;
  likes: number;
  comments: number;
  featured?: boolean;
}

const BlogSection: React.FC = () => {
  const { t } = useTranslation();

  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: t('blog.posts.post1.title'),
      excerpt: t('blog.posts.post1.excerpt'),
      content: t('blog.posts.post1.content'),
      author: 'Dr. Ahmed Hassan',
      publishDate: '2024-01-15',
      readTime: '5 min read',
      category: 'Oral Health',
      image: '/images/blog-1.jpg',
      likes: 124,
      comments: 18,
      featured: true
    },
    {
      id: '2',
      title: t('blog.posts.post2.title'),
      excerpt: t('blog.posts.post2.excerpt'),
      content: t('blog.posts.post2.content'),
      author: 'Dr. Sara Khan',
      publishDate: '2024-01-10',
      readTime: '4 min read',
      category: 'Cosmetic Dentistry',
      image: '/images/blog-2.jpg',
      likes: 89,
      comments: 12
    },
    {
      id: '3',
      title: t('blog.posts.post3.title'),
      excerpt: t('blog.posts.post3.excerpt'),
      content: t('blog.posts.post3.content'),
      author: 'Dr. Omar Sharif',
      publishDate: '2024-01-05',
      readTime: '6 min read',
      category: 'Dental Care',
      image: '/images/blog-3.jpg',
      likes: 156,
      comments: 23
    }
  ];

  // const categories = [
  //   { value: 'all', label: t('blog.categories.all') },
  //   { value: 'oral-health', label: t('blog.categories.oralHealth') },
  //   { value: 'cosmetic', label: t('blog.categories.cosmetic') },
  //   { value: 'care', label: t('blog.categories.care') },
  //   { value: 'tips', label: t('blog.categories.tips') }
  // ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('blog.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('blog.description')}
          </p>
        </div>

        {/* Featured Post */}
        <div className="mb-12">
          {blogPosts.filter(post => post.featured).map((post) => (
            <Card key={post.id} className="overflow-hidden hover-lift">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <div className="h-64 md:h-full bg-gradient-to-br from-blue-400 to-purple-500 relative">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 text-blue-600">
                        {post.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(post.publishDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {post.readTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 p-6 md:p-8">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <User className="w-4 h-4 mr-1" />
                    {post.author}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {post.likes}
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {post.comments}
                      </div>
                    </div>
                    <Button variant="outline" className="group">
                      {t('blog.readMore')}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Regular Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {blogPosts.filter(post => !post.featured).map((post) => (
            <Card key={post.id} className="overflow-hidden hover-lift group">
              <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 relative">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-green-600">
                    {post.category}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <button className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                    {/* <Share2 className="w-4 h-4 text-gray-600" /> */}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <User className="w-4 h-4 mr-1" />
                  {post.author}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(post.publishDate)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {post.readTime}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-1" />
                      {post.likes}
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {post.comments}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="group">
                    {t('blog.readMore')}
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* View All Posts Button */}
        <div className="text-center">
          <Button size="lg" variant="outline" className="group">
            {t('blog.viewAllPosts')}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
