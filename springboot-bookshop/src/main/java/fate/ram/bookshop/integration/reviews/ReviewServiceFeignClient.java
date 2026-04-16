package fate.ram.bookshop.integration.reviews;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

/**
 * OpenFeign client to talk to the review-service.
 *
 * review-service exposes:
 * - POST /reviews/average/batch
 */
@FeignClient(name = "review-service", path = "/reviews")
public interface ReviewServiceFeignClient {

    record AverageRatingBatchRequest(List<Long> bookIds) {
    }

    record AverageRatingResponse(Long bookId, double averageRating, long reviewCount) {
    }

    @PostMapping("/average/batch")
    List<AverageRatingResponse> averageBatch(@RequestBody AverageRatingBatchRequest request);
}
