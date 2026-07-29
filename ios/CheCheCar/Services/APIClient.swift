import Foundation

/// 薄客戶端：呼叫官網 `/api/v1`。
actor APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let baseURL: URL
    private let decoder: JSONDecoder

    init(baseURL: URL = AppConfig.apiBaseURL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
        self.decoder = JSONDecoder()
    }

    func fetchStories() async throws -> [StoryListItem] {
        let url = baseURL.appending(path: "api/v1/stories")
        let data = try await getData(from: url)
        do {
            return try decoder.decode(StoryListResponse.self, from: data).stories
        } catch {
            throw APIError.decoding(error)
        }
    }

    func fetchStory(slug: String) async throws -> StoryDetail {
        let url = baseURL.appending(path: "api/v1/stories/\(slug)")
        let data = try await getData(from: url)
        do {
            return try decoder.decode(StoryDetail.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }

    func fetchMeta() async throws -> ChannelMeta {
        let url = baseURL.appending(path: "api/v1/meta")
        let data = try await getData(from: url)
        do {
            return try decoder.decode(ChannelMeta.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }

    private func getData(from url: URL) async throws -> Data {
        let request = URLRequest(url: url, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 30)
        do {
            let (data, response) = try await session.data(for: request)
            if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                throw APIError.badStatus(http.statusCode)
            }
            return data
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.transport(error)
        }
    }
}
