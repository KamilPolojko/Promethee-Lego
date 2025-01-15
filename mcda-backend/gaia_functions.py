import numpy as np
from sklearn.decomposition import PCA


def calculate_gaia_pca(alternatives_matrix, criteria_weights):
    normalized_matrix = (alternatives_matrix - alternatives_matrix.min(axis=0)) / \
                        (alternatives_matrix.max(axis=0) - alternatives_matrix.min(axis=0))

    weighted_matrix = normalized_matrix * np.array(criteria_weights)

    pca = PCA(n_components=1)
    projected_alternatives = pca.fit_transform(weighted_matrix)

    criteria_directions = pca.components_.T

    return {
        "alternatives": projected_alternatives,
        "criteria": criteria_directions,
        "explained_variance": pca.explained_variance_ratio_
    }

def format_gaia_results(input_data, alternative_names, criteria_names):
    formatted_result = {
        "criterias": [
            {
                "name": criteria_names[i],
                "x": float(coord[0]),
                "y": float(coord[1])
            }
            for i, coord in enumerate(input_data["criteria"])
        ],
        "alternatives": [
            {
                "name": alternative_names[i],
                "x": float(coord[0]),
                "y": float(coord[1])
            }
            for i, coord in enumerate(input_data["alternatives"])
        ],
        "explained_variance": [
            float(var) for var in input_data["explained_variance"]
        ]
    }
    return formatted_result



def calculate_decision_axis(criteria_coordinates, weights):
    """
    Oblicza współrzędne osi decyzyjnej GAIA.

    Parameters:
    criteria_coordinates: lista słowników z polami {"name": str, "x": float, "y": float}
    weights: lista wag odpowiadających kryteriom

    Returns:
    tuple: (x, y) współrzędne wektora osi decyzyjnej
    """
    # Wyciągnij współrzędne x i y z listy słowników
    coordinates = np.array([(c["x"], c["y"]) for c in criteria_coordinates])
    weights = np.array(weights)

    # Oblicz współrzędne osi decyzyjnej
    decision_x = np.sum(coordinates[:, 0] * weights)
    decision_y = np.sum(coordinates[:, 1] * weights)

    # Normalizuj wektor, aby uzyskać jednostkową długość
    magnitude = np.sqrt(decision_x ** 2 + decision_y ** 2)
    if magnitude != 0:
        decision_x /= magnitude
        decision_y /= magnitude

    return (decision_x, decision_y)
