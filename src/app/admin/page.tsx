"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Tab } from "@headlessui/react";
import {
  UserGroupIcon,
  NewspaperIcon,
  ChatBubbleLeftIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [news, setNews] = useState([]);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, newsRes, commentsRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/news"),
          fetch("/api/admin/comments"),
        ]);

        const [usersData, newsData, commentsData] = await Promise.all([
          usersRes.json(),
          newsRes.json(),
          commentsRes.json(),
        ]);

        setUsers(usersData.users);
        setNews(newsData.news);
        setComments(commentsData.comments);
        setRelatedArticles(newsData.relatedArticles);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Dashboard
        </h1>

        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 shadow">
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  "ring-white ring-opacity-60 ring-offset-2 ring-offset-green-400 focus:outline-none focus:ring-2",
                  selected
                    ? "bg-green-100 text-green-700 shadow"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                )
              }
            >
              <div className="flex items-center justify-center gap-2">
                <UserGroupIcon className="h-5 w-5" />
                Users
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  "ring-white ring-opacity-60 ring-offset-2 ring-offset-green-400 focus:outline-none focus:ring-2",
                  selected
                    ? "bg-green-100 text-green-700 shadow"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                )
              }
            >
              <div className="flex items-center justify-center gap-2">
                <NewspaperIcon className="h-5 w-5" />
                News
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  "ring-white ring-opacity-60 ring-offset-2 ring-offset-green-400 focus:outline-none focus:ring-2",
                  selected
                    ? "bg-green-100 text-green-700 shadow"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                )
              }
            >
              <div className="flex items-center justify-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Related Articles
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  "ring-white ring-opacity-60 ring-offset-2 ring-offset-green-400 focus:outline-none focus:ring-2",
                  selected
                    ? "bg-green-100 text-green-700 shadow"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                )
              }
            >
              <div className="flex items-center justify-center gap-2">
                <ChatBubbleLeftIcon className="h-5 w-5" />
                Comments
              </div>
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-4">
            <Tab.Panel>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user: any) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.image ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={user.image}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <UserGroupIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === "ADMIN"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-green-600 hover:text-green-900">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title & Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source & Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stats
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {news.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt=""
                                className="h-16 w-24 object-cover rounded mr-4"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.title}
                              </div>
                              <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.source}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(item.publishedAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(item.publishedAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item._count.comments} Comments
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {item._count.savedBy} Saves
                            </span>
                            {item.sentiment && item.sentiment.score && (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  item.sentiment.score > 0
                                    ? "bg-green-100 text-green-800"
                                    : item.sentiment.score < 0
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                Sentiment:{" "}
                                {Number(item.sentiment.score).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex flex-col gap-2">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </a>
                            <button className="text-red-600 hover:text-red-900">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {relatedArticles.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Related Article
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Main Article
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source & Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {relatedArticles.map((article: any) => (
                        <tr key={article.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {article.title}
                            </div>
                            {article.description && (
                              <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {article.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {article.news.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {article.source}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(
                                article.publishedAt
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(
                                article.publishedAt
                              ).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex flex-col gap-2">
                              <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </a>
                              <button className="text-red-600 hover:text-red-900">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No Related Articles
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      There are no related articles available at the moment.
                    </p>
                  </div>
                )}
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        News
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comments.map((comment: any) => (
                      <tr key={comment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {comment.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {comment.user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {comment.news.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {comment.content}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
