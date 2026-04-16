package fate.ram.bookshop.integration.reviews;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ReviewRatingsClient {

    private static final Logger log = LoggerFactory.getLogger(ReviewRatingsClient.class);

    private final ReviewServiceFeignClient reviewService;

    public ReviewRatingsClient(ReviewServiceFeignClient reviewService) {
        this.reviewService = reviewService;
    }

    public record BookRating(double averageRating, long reviewCount) {
        public static final BookRating ZERO = new BookRating(0.0, 0L);
    }

    /**
     * Fetch average rating + count for a set of book IDs from review-service.
     *
     * Uses OpenFeign + Eureka service discovery.
     */
    public Map<Long, BookRating> getAverageRatings(List<Long> bookIds) {
        if (bookIds == null || bookIds.isEmpty()) {
            return Map.of();
        }

        List<Long> normalized = bookIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (normalized.isEmpty()) {
            return Map.of();
        }

        try {
            List<ReviewServiceFeignClient.AverageRatingResponse> body =
                    reviewService.averageBatch(new ReviewServiceFeignClient.AverageRatingBatchRequest(normalized));

            if (body == null || body.isEmpty()) {
                return Map.of();
            }

            Map<Long, BookRating> out = new HashMap<>(body.size());
            for (ReviewServiceFeignClient.AverageRatingResponse r : body) {
                if (r == null || r.bookId() == null) {
                    continue;
                }
                out.put(r.bookId(), new BookRating(r.averageRating(), r.reviewCount()));
            }
            return out;
        } catch (Exception ex) {
            // Keep the previous behavior: the caller (BookService) can decide how to fallback.
            log.warn("Failed to fetch ratings from review-service via OpenFeign", ex);
            throw ex;
        }
    }
}
