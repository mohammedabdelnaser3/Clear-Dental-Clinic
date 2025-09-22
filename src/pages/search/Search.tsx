import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon, Users, Calendar, FileText, Clock, ArrowRight } from 'lucide-react';
import SearchBar from '../../components/common/SearchBar';
import { Card } from '../../components/ui';

interface SearchResult {
  id: string;
  type: 'patient' | 'appointment' | 'prescription' | 'medication';
  title: string;
  subtitle: string;
  description?: string;
  date?: string;
  status?: string;
  url: string;
}

const Search: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Mock search function - replace with actual API call
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock results - replace with actual search API
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'patient' as const,
        title: 'John Doe',
        subtitle: 'Patient ID: P001',
        description: 'Last visit: 2 weeks ago',
        date: '2024-01-15',
        status: 'Active',
        url: '/patients/1'
      },
      {
        id: '2',
        type: 'appointment' as const,
        title: 'Dental Cleaning - Sarah Wilson',
        subtitle: 'Today at 2:00 PM',
        description: 'Room 3 with Dr. Smith',
        date: '2024-01-30',
        status: 'Scheduled',
        url: '/appointments/2'
      },
      {
        id: '3',
        type: 'prescription' as const,
        title: 'Amoxicillin 500mg',
        subtitle: 'Prescribed to Mike Johnson',
        description: 'Take 3 times daily for 7 days',
        date: '2024-01-28',
        status: 'Active',
        url: '/prescriptions/3'
      }
    ].filter(result => 
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setResults(mockResults);
    setLoading(false);
  };

  useEffect(() => {
    performSearch(query);
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setSelectedIndex(-1);
    // Update URL with search query
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`, { replace: true });
    } else {
      navigate('/search', { replace: true });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          navigate(results[selectedIndex].url);
        }
        break;
      case 'Escape':
        setSelectedIndex(-1);
        break;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'patient':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'appointment':
        return <Calendar className="w-5 h-5 text-green-600" />;
      case 'prescription':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'medication':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <SearchIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('search.title', 'Search')}
        </h1>
        <p className="text-gray-600">
          {t('search.description', 'Search for patients, appointments, prescriptions, and more')}
        </p>
      </div>

      <div className="mb-8" onKeyDown={handleKeyDown}>
        <SearchBar
          placeholder={t('search.placeholder', 'Search patients, appointments, prescriptions...')}
          onSearch={handleSearch}
          initialValue={query}
          loading={loading}
          className="w-full"
        />
      </div>

      {query && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {loading 
              ? t('search.searching', 'Searching...')
              : t('search.results_count', `Found ${results.length} results for "${query}"`)
            }
          </p>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={result.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedIndex === index ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => navigate(result.url)}
          >
            <Card className="p-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getResultIcon(result.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {result.title}
                  </h3>
                  {result.status && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{result.subtitle}</p>
                {result.description && (
                  <p className="text-sm text-gray-500 mb-2">{result.description}</p>
                )}
                {result.date && (
                  <p className="text-xs text-gray-400">{result.date}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            </Card>
          </div>
        ))}
      </div>

      {query && !loading && results.length === 0 && (
        <div className="text-center py-12">
          <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('search.no_results', 'No results found')}
          </h3>
          <p className="text-gray-600">
            {t('search.no_results_description', 'Try adjusting your search terms or check for typos')}
          </p>
        </div>
      )}

      {!query && (
        <div className="text-center py-12">
          <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('search.start_searching', 'Start searching')}
          </h3>
          <p className="text-gray-600">
            {t('search.start_searching_description', 'Enter a search term to find patients, appointments, and more')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
